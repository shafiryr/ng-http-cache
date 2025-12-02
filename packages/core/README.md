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
const data = computed(() => itemsQuery.data());
const loading = computed(() => itemsQuery.loading());
const error = computed(() => itemsQuery.error());
```

### Force Refresh

```ts
itemsQuery.fetch(true);
```

### Invalidate Cache

```ts
itemsQuery.invalidate();
```

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
