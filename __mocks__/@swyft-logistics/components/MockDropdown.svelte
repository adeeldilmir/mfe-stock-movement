<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();
  export let label: string = "";
  export let name: string = "";
  export let selected: any = "";
  export let items: Array<any> = [];
  export let placeholder: string = "";
  export let displayProperty: string = "";
  export let valueProperty: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  let id: string = "0";
  export function reset() {
    selected = "";
  }
  onMount(() => {
    id = Math.random().toString(16).slice(2);
  });
  $: dispatch("selected-changed", {
    selected,
  });
</script>

<div class="input-container">
  <label for="select-{id}">{label}</label>
  <input
    id="select-{id}"
    class="select-container"
    bind:value={selected}
    on:change
    on:input
  />
</div>

<style>
</style>
