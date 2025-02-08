<script lang="ts">
  export let selected: string = "";

  function getTabs() {
    return document.getElementById("tabs").querySelectorAll("button, a");
  }

  function onClickHandler(e) {
    const tabs = getTabs();

    if (!tabs) {
      return;
    }

    Array.from(tabs).forEach((tab) => {
      if (e.target === tab) {
        selected = (tab as HTMLElement).dataset.name;
        e.target.click();
      }
    });
  }
</script>

<div id="tabs" class="tabs" on:click={onClickHandler}>
  <slot name="tabs" />
</div>

<div class="content">
  <slot name="content" />
</div>

<style>
  /* Style the tab */
  .tabs {
    overflow: hidden;
    border: 1px solid #ccc;
    background-color: #f1f1f1;
  }
</style>
