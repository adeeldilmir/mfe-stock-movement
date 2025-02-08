import App from "./App.svelte";
import singleSpaSvelte from "single-spa-svelte";

const svelteLifecycles = singleSpaSvelte({
    component: App,
    domElementGetter: () =>
        document.getElementById(
            "single-spa-application:@swyft-logistics/stock-movement"
        ),
});

export const bootstrap = svelteLifecycles.bootstrap;
export const mount = svelteLifecycles.mount;
export const unmount = svelteLifecycles.unmount;
