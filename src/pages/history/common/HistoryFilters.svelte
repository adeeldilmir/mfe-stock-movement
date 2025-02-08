<script lang="ts">
  import {
    Input,
    AutoComplete,
    DateInput,
    Button,
  } from "@swyft-logistics/styleguide";

  export let journeyType;
  export let destinationCity;
  export let currentStatus;
  export let driversSelected;
  export let originHub;
  export let itemsDestinationCity: Array<{ id: string; name: string }>;
  export let itemsOriginHub: Array<{ id: string; name: string }>;
  export let itemsCurrentStatus: Array<string>;
  export let itemsDriver: Array<{ id: string; name: string }> = [];
  export let disabledFields: boolean;
  export let showDrivers: boolean;
  export let searchHandler: Function;
  export let clearHandler: Function;
  export let searchButtonTestId: string;
  export let filterName: string;
  export let dateFrom;
  export let dateTo;
  export let showDestinationHub: Boolean;
  export let destinationHub;
  export let showJourney: Boolean = true;
  let itemsJourney: Array<string> = ["Forward", "Return"];
  export let minDate = 'today';
  export let entityId: string;
  export let inputLabel;
  export let inputPlaceholder;
 
  let showFilter: boolean = false;
  function showFiltersHandler() {
    showFilter = showFilter === false ? true : false;
  }
  function enterKeyUp(e, key) {
    let keyCode = e.code || e.key;
    if (keyCode == key){
      searchHandler();
    }
  }
</script>

<div>{filterName}</div>
<div class="grid-container-top">
  <div class="grid-item-input">
    <Input
    bind:value={entityId}
    label={inputLabel}
    on:keyup={(e) => enterKeyUp(e, 'Enter')}
    placeholder={inputPlaceholder}
    required
  />
  </div>
  <div class="grid-item">
    <div class="show-filter button">
      <Button
      label={showFilter ? "Hide Filters" : "Show Filters"}
      testId="show-filters"
      on:click={showFiltersHandler}
      />
    </div>
  </div>
</div>
{#if showFilter}
<div class="grid-container">
  <div class="grid-item">
    <DateInput label="From:" on:change bind:value={dateFrom} />
  </div>
  <div class="grid-item">
    <DateInput
      label="To:"
      disabled={dateFrom ? false : true}
      bind:min={minDate}
      bind:value={dateTo}
    />
  </div>
</div>
<div class="grid-container">
  <div class="grid-item">
    <AutoComplete
      bind:value={currentStatus}
      label="Current Status"
      placeholder="Select Current Status"
      bind:items={itemsCurrentStatus}
      required
      disabled={disabledFields}
    />
  </div>
  {#if showJourney}
    <div class="grid-item">
      <AutoComplete
        bind:value={journeyType}
        label="Journey"
        placeholder="Select Journey Type"
        bind:items={itemsJourney}
        required
        disabled={disabledFields}
      />
    </div>
  {/if}
</div>
<div class="grid-container">
  <div class="grid-item">
    <AutoComplete
      bind:value={originHub}
      multiple={true}
      label="Origin Hub"
      placeholder="Select Origin Hub"
      displayProperty="name"
      bind:items={itemsOriginHub}
      required
      disabled={disabledFields}
    />
  </div>
  {#if showDestinationHub}
    <div class="grid-item">
      <AutoComplete
        bind:value={destinationHub}
        multiple={true}
        label="Destination Hub"
        placeholder="Select Destination Hub"
        displayProperty="name"
        bind:items={itemsOriginHub}
        required
        disabled={disabledFields}
      />
    </div>
  {/if}
  {#if !showDestinationHub}
    <div class="grid-item">
      <AutoComplete
        bind:value={destinationCity}
        multiple={true}
        label="Destination City"
        placeholder="Select Destination City"
        displayProperty="name"
        valueProperty="id"
        bind:items={itemsDestinationCity}
        required
        disabled={disabledFields}
      />
    </div>
  {/if}
  {#if showDrivers}
    <div class="grid-item">
      <AutoComplete
        bind:value={driversSelected}
        multiple={true}
        label="Drivers"
        placeholder="Select Drivers"
        displayProperty="name"
        valueProperty="id"
        bind:items={itemsDriver}
        required
        disabled={disabledFields}
      />
    </div>
  {/if}
</div>
{/if}
<div class="grid-container">
  <div class="grid-item ">
    <div class="button">
      <Button
        label="Apply Filters"
        testId={searchButtonTestId}
        on:click={searchHandler}
      />
    </div>
    <div class="button">
      <Button label="Clear" on:click={clearHandler} />
    </div>
  </div>
</div>

<style>
  .button {
    max-width: 150px;
    display: inline-block;
  }
  .grid-container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    column-gap: 1rem;
  }
  .grid-container-top{
    display: grid;
    grid-template-columns: auto auto;
  }
  .grid-item {
    padding-bottom: 1rem;
  }
  .show-filter {
    float: right;
  }
  .grid-item-input{
    padding-bottom: 1rem;
    max-width: 500px;
  }
  :global(.log.info) {
    --toastBackground: green;
  }
  :global(.log.warn) {
    --toastBackground: red;
  }
</style>
