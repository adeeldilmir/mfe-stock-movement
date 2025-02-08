<script lang="ts">
    import { createEventDispatcher } from "svelte";
  
    const dispatch = createEventDispatcher();
  
    export let label: string = "";
    export let item: any = null;
    export let isDismissible: boolean = false;
    const iconClearPath =
      "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z";
  
    function handleDismiss() {
      dispatch("clear", {
        label,
        item,
      });
    }
  </script>
  
  <div class="token">
    <div class="token-content">
      <span>{label}</span>
      {#if isDismissible}
        <div class="token-remove" title="Remove" on:click={handleDismiss}>
          <svg
            class="icon-clear"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
          >
            <path d={iconClearPath} />
          </svg>
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    .token {
      align-items: center;
      background-color: hsl(214, 17%, 92%);
      border-radius: 1.25rem;
      display: inline-block;
      margin: 0.25rem 0.5rem 0.25rem 0;
      max-height: 1.3rem;
      padding: 0.25rem 0.5rem 0.25rem 0.5rem;
      transition: background-color 0.3s;
      white-space: nowrap;
    }
  
    .token-content {
      display: flex;
    }
    .token:hover {
      background-color: hsl(214, 15%, 88%);
    }
  
    .token-remove {
      align-items: center;
      background-color: hsl(214, 15%, 55%);
      border-radius: 50%;
      color: hsl(214, 17%, 92%);
      display: flex;
      justify-content: center;
      height: 1.25rem;
      margin-left: 0.25rem;
      min-width: 1.25rem;
    }
    .token-remove:hover {
      background-color: hsl(215, 21%, 43%);
      cursor: pointer;
    }
  </style>
  