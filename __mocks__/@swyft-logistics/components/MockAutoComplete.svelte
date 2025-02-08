<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();
  export let label: string = "";
  export let name: string = "";
  export let value: Array<any> = [];
  export let items: Array<any> = [];
  export let placeholder: string = "";
  export let displayProperty: string = "";
  export let valueProperty: string = "";
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let orderableSelection: boolean = false;
  export let multiple: boolean = false; 
  let id: string = "0";
  export function reset() {
    value = [];
  }
  onMount(() => {
    id = Math.random().toString(16).slice(2);
  });
  $: dispatch("value-changed", {
    value,
  });
</script>

<div class="input-container">
  <label for="select-{id}">{label}</label>
  <input
    id="select-{id}"
    class="select-container"
    bind:value
    on:change={(e) => {
      value = [e.target.value];
    }}
    on:input
  />
</div>

<style>
</style>
