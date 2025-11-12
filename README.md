# No Hello v3

A modern rebuild of [nohello.net](https://nohello.net/) using Vite, React 19, Tailwind CSS, and Cloudflare Pages.

## About

This project educates people about efficient asynchronous communication. Instead of just saying "Hello" in chat and waiting for a response, you should include your question or request in the first message.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **i18next** - Internationalization
- **Cloudflare Pages** - Hosting and deployment

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Building

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Cloudflare Pages

This project is configured for Cloudflare Pages deployment.

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy using Wrangler:
   ```bash
   npm run deploy
   ```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments on push.

## Translations

Translations are managed using i18next and stored in two locations:

1. **Local files** (`src/i18n/locales/`) - Used for development and as fallback
2. **Backblaze B2** (`translations/<language>.json`) - Served via Cloudflare Pages Functions in production

Currently supported languages:

- English (en)
- Spanish (es)
- French (fr)
- German (de)

### Translation Architecture

- **Development**: Translations are loaded directly from local JSON files for fast iteration
- **Production**: Translations are served from Backblaze B2 via a Cloudflare Pages Function (`/functions/translations/[language].ts`)
  - Cloudflare caches translations at the edge (1 hour cache, 24 hour stale-while-revalidate)
  - Falls back to local files if B2 is unavailable
  - Automatic fallback ensures the app always works

### Adding Translations

1. Add a new JSON file in `src/i18n/locales/` (e.g., `it.json` for Italian)
2. Copy the structure from `en.json` and translate the values
3. Import and add the translation to `src/i18n/config.ts`
4. Add the language option to `src/components/LanguageSwitcher.tsx`
5. Upload to B2 using `npm run upload-translations`

### Uploading Translations to Backblaze B2

Before uploading, set up your Backblaze B2 credentials:

1. Create a Backblaze B2 bucket (or use an existing one)
2. Create an Application Key with read/write permissions
3. Set environment variables:

```bash
export B2_APPLICATION_KEY_ID="your_key_id"
export B2_APPLICATION_KEY="your_application_key"
export B2_BUCKET_NAME="your_bucket_name"
```

Then upload all translations:

```bash
npm run upload-translations
```

This will upload all files from `src/i18n/locales/` to `translations/<language>.json` in your B2 bucket.

### Cloudflare Pages Configuration

For production, configure environment variables in your Cloudflare Pages dashboard:

**Option 1: Full bucket URL (recommended for public buckets)**
```
B2_BUCKET_URL=https://f000.backblazeb2.com/file/your-bucket-name
```

**Option 2: Separate bucket name and download URL**
```
B2_BUCKET_NAME=your-bucket-name
B2_DOWNLOAD_URL=https://f000.backblazeb2.com
```

The Cloudflare Pages Function will:
- Fetch translations from B2
- Cache responses at the edge (1 hour)
- Return proper CORS headers
- Handle errors gracefully with fallback

### Translation File Structure

Translation files are stored in B2 under the `translations/` prefix:
```
translations/
  ├── en.json
  ├── es.json
  ├── fr.json
  └── de.json
```

The Cloudflare Function serves these at `/translations/:language`, which i18next loads automatically in production.

## Testing

This project uses [Vitest](https://vitest.dev/) for unit testing and [React Testing Library](https://testing-library.com/react) for component testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Generate coverage report in watch mode
npm run test:coverage:watch
```

### Coverage Reports

Coverage reports are generated in multiple formats:
- **Text**: Displayed in terminal
- **HTML**: Interactive report in `coverage/index.html`
- **JSON**: Machine-readable format in `coverage/coverage-final.json`
- **LCOV**: For CI/CD integration in `coverage/lcov.info`

View the HTML report:
```bash
npm run test:coverage
open coverage/index.html
```

### Coverage Thresholds

Current coverage thresholds:
- Lines: 50%
- Functions: 50%
- Branches: 40%
- Statements: 50%

## Features

- ✅ Responsive design
- ✅ Dark mode support (via system preference)
- ✅ Multi-language support
- ✅ Modern React 19 features
- ✅ TypeScript for type safety
- ✅ Cloudflare Pages ready
- ✅ Comprehensive test coverage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Inspired by the original [nohello.net](https://nohello.net/) project.
