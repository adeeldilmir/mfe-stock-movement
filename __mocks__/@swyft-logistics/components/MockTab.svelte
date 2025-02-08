<script lang="ts">
  export let id: string = "";
  export let name: string = "";
  export let selected: string = "";
  export let title: string = "";
  export let active: boolean = false;

  let className: string = "";
  export { className as class };

  function setSelectedTab() {
    selected = name;
  }
  $: if (name === selected) {
    active = true;
  } else {
    active = false;
  }
</script>

<button
  class={className}
  data-name={name}
  label={title}
  class:active
  on:click={(event) => {
    setSelectedTab();
  }}
  {id}>{title}</button
>

<style>
  /* Create an active/current tablink class */
  .tab.active {
    background-color: #ccc;
  }
</style>
