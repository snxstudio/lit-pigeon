import { Injectable, InjectionToken, inject } from '@angular/core';
import type { MergeTag } from '@lit-pigeon/angular';

/** Returns the current access token. Provide it from your auth layer. */
export const ACCESS_TOKEN = new InjectionToken<() => string>('ACCESS_TOKEN');

export interface StoredTemplate {
  mjml: string;
  html: string;
}

/** Your application's own API. The paths are placeholders. */
@Injectable({ providedIn: 'root' })
export class EmailApi {
  private readonly token = inject(ACCESS_TOKEN);

  async loadTemplate(id: string): Promise<StoredTemplate> {
    return this.request<StoredTemplate>(`/api/email-templates/${encodeURIComponent(id)}`);
  }

  async saveTemplate(id: string, template: StoredTemplate): Promise<void> {
    await this.request(`/api/email-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
  }

  async listMergeTags(): Promise<MergeTag[]> {
    return this.request<MergeTag[]>('/api/merge-tags');
  }

  /** Uploads one image and resolves to the public URL stored on the image block. */
  async uploadImage(file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file, file.name);
    const { url } = await this.request<{ url: string }>('/api/email-assets', { method: 'POST', body });
    return url;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.token()}`);
    const res = await fetch(path, { ...init, headers });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}
