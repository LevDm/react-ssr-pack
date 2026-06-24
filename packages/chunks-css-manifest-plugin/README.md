# @react-ssr-pack/chunks-css-manifest-plugin

Update your webpack settings and add @react-ssr-pack/chunks-css-manifest-plugin in plugins section for client side build:

```javascript
module.exports = {
    // ...Your webpack client side config
    plugins: [
        // ...Your other plugins
        new ChunksCssManifestPlugin(),
    ],
}
```

All documentation see on: https://github.com/frolant/react-ssr-pack
