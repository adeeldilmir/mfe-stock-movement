<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import App from "../../../src/App.svelte";
  const dispatch = createEventDispatcher();
  export let label: string = "";
  export let name: string = "";
  export let selectedItems: Array<any> = [];
  export let items: Array<any> = [];
  export let placeholder: string = "";
  export let displayProperty: string = "";
  export let valueProperty: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  let id: string = "0";
  export function reset() {
    selectedItems = [];
  }
  onMount(() => {
    id = Math.random().toString(16).slice(2);
  });
  $: dispatch("selected-items-changed", {
    selectedItems,
  });
</script>

<div class="input-container">
  <label for="select-{id}">{label}</label>
  <input
    id="select-{id}"
    class="select-container"
    bind:value={selectedItems}
    on:change={(e) => {
      selectedItems = [e.target.value];
    }}
    on:input
  />
</div>

<style>
</style>
