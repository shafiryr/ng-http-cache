# @shafiryr/signal-http-cache

A lightweight, Angular-friendly HTTP caching solution powered by **Signals**.

[![npm version](https://img.shields.io/npm/v/@shafiryr/signal-http-cache.svg)]()
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## 🚀 Overview

**signal-http-cache** is a lightweight, fast, and elegant HTTP caching utility designed for Angular 17+ using the new **Signals** reactivity model.

It provides:

- ⚡ Smart HTTP caching with TTL
- 🔄 Stale-While-Revalidate behavior
- 🚫 Automatic in-flight deduplication (no duplicate requests)
- 🔥 Fully reactive state (`data`, `loading`, `error`)
- 🌐 Optional custom `fetch` for SSR compatibility
- 🧩 Framework-agnostic core, Angular-ready by design
- 📦 Zero dependencies

The result is a simple but powerful data-fetching mechanism that works seamlessly with Angular.

---

## 📦 Installation

```bash
npm install @shafiryr/signal-http-cache
```

---

### Peer Dependencies

```bash
@angular/core ^17 || ^18
```

---

## Basic Usage

Below is an example of how to use `createHttpQuery` with Angular signals:

```ts
import { createHttpQuery } from "@shafiryr/signal-http-cache";
import { computed } from "@angular/core";

const itemsQuery = createHttpQuery<{ name: string }[]>("/api/items", {
  ttl: 60000,
  staleWhileRevalidate: true,
});

// Reactive state
const data = itemsQuery.data();
const loading = itemsQuery.loading();
const error = itemsQuery.error();
```

---

## 🔑 Query Keys

By default, `createHttpQuery` caches requests based solely on the URL.  
However, many applications need to cache multiple states of the **same URL**,  
such as pagination, filtering, sorting, or dynamic parameters.

To support this, the library allows using a **Query Key**.

A **Query Key** is either:

### ✔ A simple URL string

```ts
const usersQuery = createHttpQuery('/api/users', {
  ttl: 60000
});
```

### ✔ A Query Key array

A **Query Key** is an array whose first element must be the request URL,  
and the rest can include any parameters that affect the result:

```ts
const usersQuery = createHttpQuery(
  ['/api/users', page(), searchTerm(), sortBy()],
  {
    ttl: 30000,
    staleWhileRevalidate: true
  }
);
```

---

### Force Refresh

```ts
itemsQuery.fetch(true);
```

---

### Invalidate Cache

```ts
itemsQuery.invalidate();
```

---

## Angular Component Example

```ts
import { Component, computed, OnInit } from "@angular/core";
import { createHttpQuery } from "@shafiryr/signal-http-cache";

@Component({
  selector: "app-items",
  standalone: true,
  template: `
    @if (loading()) {
    <div>Loading...</div>
    } @if (error()) {
    <div>{{ error() }}</div>
    } @if (data()) {
    <ul>
      @for(item of data(); track $index) {
      <li>
        {{ item.name }}
      </li>
      }
    </ul>
    }
    <button (click)="refresh()">Refresh</button>
  `,
})
export class ItemsComponent implements OnInit {
  private query = createHttpQuery<{ name: string }[]>("/api/items", {
    ttl: 60000,
    staleWhileRevalidate: true,
  });

  data = this.query.data;
  loading = this.query.loading;
  error = this.query.error;

  ngOnInit() {
    this.query.fetch();
  }

  refresh() {
    this.query.fetch(true);
  }
}
```

---

# 📡 Using Angular HttpClient (Optional)

By default, **Signal HTTP Cache** uses the native browser **fetch API**.  
This keeps the library framework-agnostic, lightweight, and compatible with:

- Angular standalone applications  
- SSR environments  
- Node workers  
- Custom fetch implementations  

However, if you prefer to route your HTTP requests through Angular’s **HttpClient**  
(for interceptors, authentication pipelines, auth tokens, logging, etc.),  
you can easily provide your own adapter function.

This is **optional** - the library does **not** require `HttpClient`.

## HttpClient → Fetch Adapter

Create a small function that mimics the behavior of `fetch` using Angular’s `HttpClient`.

```ts
// http-client-fetch-adapter.ts

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export function httpClientFetchAdapter(url: string, init?: RequestInit) {
  const http = inject(HttpClient);

  const method = init?.method ?? 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  const headers = init?.headers ?? {};

  return firstValueFrom(
    http.request(method, url, {
      body,
      headers,
      responseType: 'json'
    })
  ).then(data => {
    return {
      ok: true,
      json: () => Promise.resolve(data)
    } as Response;
  });
}
```

## Using the Adapter

Pass your adapter as the third argument to `createHttpQuery`:

```ts
import { createHttpQuery } from '@shafiryr/signal-http-cache';
import { httpClientFetchAdapter } from './http-client-fetch-adapter';

query = createHttpQuery<Item[]>('/api/items', {
  ttl: 60000,
  staleWhileRevalidate: true
}, httpClientFetchAdapter);
```


