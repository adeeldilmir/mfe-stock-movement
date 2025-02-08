<script lang="ts">
  import { onMount } from "svelte";
  import { Router, Route } from "svelte-navigator";
  import { cities, producttypes, vehicles, warehouses, drivers,statusesRepo } from "./store";
  import Counter from "./pages/counter/Counter.svelte";
  import Bagging from "./pages/bagging/Bagging.svelte";
  import BagDetails from "./pages/bagDetails/BagDetails.svelte";
  import ManifestDetails from "./pages/manifestDetails/ManifestDetails.svelte";
  import LoadingDetails from "./pages/loadingDetails/LoadingDetails.svelte";
  import Debagging from "./pages/debagging/Debagging.svelte";
  import Manifest from "./pages/manifest/Manifest.svelte";
  import Demanifest from "./pages/demanifest/Demanifest.svelte";
  import Loading from "./pages/loading/Loading.svelte";
  import Unloading from "./pages/unloading/Unloading.svelte";
  import History from "./pages/history/History.svelte";
  import ProgressBar from "svelte-progress-bar";
  import { SvelteToast } from "@zerodevx/svelte-toast";
  import { SpinnerPage } from "@swyft-logistics/styleguide";

  let loading: boolean = false;
  let progress;
  let progressBar = {
    start: startProgress,
    finish: stopProgress,
  };

  function showLoader() {
    loading = true;
  }

  function hideLoader() {
    loading = false;
  }

  function startProgress() {
    progress.start();
  }

  function stopProgress() {
    progress.complete();
  }

  onMount(async () => {
    showLoader();
    const names = "producttypes";
    await Promise.all([
      cities.init({
        url: `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/Cities?filter[order]=cityCode ASC`,
      }),
      vehicles.init({
        url: `${
          process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Vehicles?filter=${encodeURIComponent(
          JSON.stringify({ where: { isActive: true }, include: "vehicleType" })
        )}`,
      }),
      warehouses.init({
        url: `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/WarehouseLocations`,
      }),
      producttypes.init({
        url: `${
          process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/enumerations/?names=${encodeURIComponent(
          JSON.stringify(names)
        )}`,
      }),
      drivers.init({
        url: `${
          process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Drivers?filter=${encodeURIComponent(
          JSON.stringify({
            where: { and: [{ types: "linehaul" }, { isActive: true }] },
            order: "createdAt DESC",
          })
        )}`,
      }),
      statusesRepo.init({
        url: `${
          process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/StatusRepositories?filter=${encodeURIComponent(
          JSON.stringify({
            fields: [ 'id','key'],
          })
        )}`,
      }),

    ]);
    hideLoader();
  });
</script>

<main>
  <SpinnerPage {loading} />
  <ProgressBar color="#039be5" height="4px" bind:this={progress} />
  <SvelteToast />
  <Router>
    <div class="container">
      <Route path="/stock-movement/counter" primary={false}>
        <Counter progress={progressBar} />
      </Route>
      <Route path="/stock-movement/bagging" primary={false}>
        <Bagging
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/manifest" primary={false}>
        <Manifest
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/debagging" primary={false}>
        <Debagging
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/demanifest" primary={false}>
        <Demanifest
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/loading" primary={false}>
        <Loading
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/unloading" primary={false}>
        <Unloading
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route path="/stock-movement/history" primary={false}>
        <History
          progress={progressBar}
          on:show-loader={showLoader}
          on:hide-loader={hideLoader}
        />
      </Route>
      <Route
        path="/stock-movement/history/bags/:id"
        primary={false}
        let:params
      >
        <BagDetails bagId={params.id} progress={progressBar} />
      </Route>
      <Route
        path="/stock-movement/history/manifests/:id"
        primary={false}
        let:params
      >
        <ManifestDetails manifestId={params.id} progress={progressBar} />
      </Route>
      <Route
        path="/stock-movement/history/loadings/:id"
        primary={false}
        let:params
      >
        <LoadingDetails loadId={params.id} progress={progressBar} />
      </Route>
    </div>
  </Router>
</main>

<style>
  .container {
    padding: 1rem;
  }
  :global(.svelte-progress-bar) {
    height: 4px !important;
  }

  :global(.info) {
    --toastBackground: blue;
  }

  :global(.warn) {
    --toastBackground: yellow;
  }

  :global(.success) {
    --toastBackground: green;
  }

  :global(.error) {
    --toastBackground: #dc3545;
  }
</style>
