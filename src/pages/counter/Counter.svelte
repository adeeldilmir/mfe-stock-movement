<script lang="ts">
  let count: number = 0;
  export let progress: any;

  const increment = () => {
    progress.start();
    count += 1;
    progress.finish();
  };
</script>

<button on:click={increment}>Count is {count}</button>
