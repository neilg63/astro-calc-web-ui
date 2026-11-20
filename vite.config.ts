import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Where the site is deployed, unless `VITE_SITE_URL` says otherwise. */
const DEFAULT_SITE_URL = 'https://astrodemo.multifaceted.info'

/**
 * Fills `%SITE_URL%` in index.html with the site's public address (`VITE_SITE_URL`, or the
 * default above), which the sharing tags need: link previews only load an image from an
 * absolute URL. With an empty `VITE_SITE_URL=` the paths stay root-relative and tags marked `data-absolute` are removed, since a
 * canonical link or `og:url` must be absolute to mean anything.
 */
function siteUrl(address: string): Plugin {
  const base = address.trim().replace(/\/+$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const tagged = base ? html.replace(/\s+data-absolute(?=\s*\/?>)/g, '') : html.replace(/^.*\sdata-absolute\s*\/?>\s*\n/gm, '')
        return tagged.replaceAll('%SITE_URL%', base)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), siteUrl(loadEnv(mode, process.cwd()).VITE_SITE_URL ?? DEFAULT_SITE_URL)],
}))
