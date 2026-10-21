import {defineConfig} from 'vitest/config';

// Compares ports of Strudel examples with Strudel itself: npx vitest run -c vitest.compat.config.mjs
export default defineConfig({
    test: {
        include: ['test/compat/**/*.test.js'],
        globals: true,
        environment: 'node',
        server: {deps: {inline: [/@strudel/, /@kabelsalat/, /superdough/]}}
    }
});
