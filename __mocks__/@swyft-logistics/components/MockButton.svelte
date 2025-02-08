<script lang="ts">
  export let label: string = "";
  export let readonly: boolean = false;
  export let disabled: boolean = false;
  export let type: string = "button";
  export let testId: string = "";
</script>

<button {type} data-testid={testId} on:click>{label}</button>
