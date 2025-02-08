<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let label: string = "";
  export let placeholder: string = "";
  export let value: string = "";
  export let readonly: boolean = false;
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let type: string = "";
  export let id : string= "0";
  export let valueProperty: string = "";
  export let displayProperty: string = "";

  export function focus() {
    input.focus();
  }
  // let id: string = "0";
  let input;
  onMount(() => {
    id = Math.random().toString(16).slice(2);
  });

  $: dispatch("value-changed", {
    value,
  });
</script>

<label for={`input-${id}`}>{label}</label>
<input
  bind:this={input}
  id={`input-${id}`}
  bind:value
  {required}
  {placeholder}
  {disabled}
  {readonly}
  on:change
  on:input
/>
