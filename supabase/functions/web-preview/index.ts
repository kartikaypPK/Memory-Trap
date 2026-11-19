// Memory Trap — web preview host.
// Serves the exported web build's entry HTML (assets are in the public
// Supabase Storage bucket 'memory-trap-web'; Storage itself serves HTML
// as text/plain, so the entry page is served from here instead).
// Public by design (verify_jwt off): it returns a static HTML page only.
const HTML = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <script>history.replaceState(null,'','/storage/v1/object/public/memory-trap-web/');</script>\n    <meta charset=\"utf-8\" />\n    <meta httpEquiv=\"X-UA-Compatible\" content=\"IE=edge\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\" />\n    <title>Memory Trap</title>\n    <!-- The `react-native-web` recommended style reset: https://necolas.github.io/react-native-web/docs/setup/#root-element -->\n    <style id=\"expo-reset\">\n      /* These styles make the body full-height */\n      html,\n      body {\n        height: 100%;\n      }\n      /* These styles disable body scrolling if you are using <ScrollView> */\n      body {\n        overflow: hidden;\n      }\n      /* These styles make the root element full-height */\n      #root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n      }\n    </style>\n  <link rel=\"icon\" href=\"/storage/v1/object/public/memory-trap-web/favicon.ico\"/></head>\n\n  <body>\n    <!-- Use static rendering with Expo Router to support running without JavaScript. -->\n    <noscript> You need to enable JavaScript to run this app. </noscript>\n    <!-- The root element for your Expo app. -->\n    <div id=\"root\"></div>\n  <script src=\"/storage/v1/object/public/memory-trap-web/_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js\" defer></script><script src=\"/storage/v1/object/public/memory-trap-web/_expo/static/js/web/__common-5d238eaf1323c8f677cc692cb416bd29.js\" defer></script><script src=\"/storage/v1/object/public/memory-trap-web/_expo/static/js/web/entry-ba1c6df8fc810d0483d528a32e64dee7.js\" defer></script>\n</body>\n</html>\n";

Deno.serve(() =>
  new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  })
);
