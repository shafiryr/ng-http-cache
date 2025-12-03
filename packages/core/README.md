# @shafiryr/signal-http-cache

A lightweight, Signal-powered HTTP caching library for Angular.

[![npm version](https://img.shields.io/npm/v/@shafiryr/signal-http-cache.svg)](https://www.npmjs.com/package/@shafiryr/signal-http-cache)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-16+-dd0031.svg)](https://angular.io/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **TTL-based Caching** | Automatic cache expiration with configurable time-to-live |
| 🔄 **Stale-While-Revalidate** | Serve cached data instantly while fetching fresh data in background |
| 🚫 **Request Deduplication** | Automatic in-flight request deduplication - no duplicate API calls |
| 🎯 **Race Condition Prevention** | Force refresh aborts previous pending requests |
| 🧠 **Pure Signals** | Native Angular Signals - no RxJS, no subscriptions |
| 🧹 **Auto Cleanup** | Automatic cache cleanup via Angular `DestroyRef` |
| 🔗 **Shared Cache** | Multiple components share the same cache with reference counting |
| 🛑 **Request Cancellation** | AbortController support for cancelling requests |
| 🌐 **Custom Fetch** | Use native `fetch` or provide your own (HttpClient, SSR, etc.) |

---

## 📦 Installation

```bash
npm install @shafiryr/signal-http-cache
```

---

### Peer Dependencies

```bash
|-----------------|------------|
| `@angular/core` | `>=16.0.0` |
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

Query keys determine how requests are cached. Use them to cache different states of the same endpoint.

### Simple URL

```ts
const query = createHttpQuery('/api/users', { ttl: 60000 });
```

### Parameterized Query Key

```ts
const query = createHttpQuery(
  ['/api/users', page(), searchTerm(), sortBy()],
  { ttl: 30000 }
);
```

Each unique combination creates a separate cache entry, perfect for:
- Pagination
- Search/filtering
- Sorting
- Any dynamic parameters

---

### TTL (Time-to-Live)

```ts
const query = createHttpQuery('/api/data', {
  ttl: 60000 // 60 seconds
});
```

---

### Force Refresh

Ignore cache, always fetch fresh data
```ts
await query.fetch(true);
```

### Invalidate Cache

Mark cache as stale and abort any pending request
```ts
query.invalidate();
```

----

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

## 📡 Using Angular HttpClient (Optional)

By default, the library uses the native browser `fetch` API. To use Angular's `HttpClient` instead (for interceptors, auth tokens, etc.), create an adapter:

This is **optional** - the library does **not** require `HttpClient`.

### HttpClient → Fetch Adapter

```ts
// http-client-fetch-adapter.ts

import { inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

export function httpClientFetchAdapter(url: string, init?: RequestInit) {
  const http = inject(HttpClient);

  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  const headers = init?.headers ?? {};

  return firstValueFrom(
    http.request(method, url, {
      body,
      headers,
      responseType: "json",
    })
  ).then((data) => {
    return {
      ok: true,
      json: () => Promise.resolve(data),
    } as Response;
  });
}
```

### Using the Adapter

Pass your adapter as the third argument to `createHttpQuery`:

```ts
import { createHttpQuery } from "@shafiryr/signal-http-cache";
import { httpClientFetchAdapter } from "./http-client-fetch-adapter";

query = createHttpQuery<Item[]>(
  "/api/items",
  {
    ttl: 60000,
    staleWhileRevalidate: true,
  },
  httpClientFetchAdapter
);
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
