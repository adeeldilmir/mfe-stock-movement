<script lang="ts">
    export let message: string = "";
    export let isDismissible: boolean = false;
    export let open: boolean = false;
    export let type: string = "info";
  
    let messageComponent;
  
    function handleClose() {
      open = false;
    }
  </script>
  
  {#if open}
    <div
      class="message"
      class:message-error={type === "error"}
      class:message-info={type === "info"}
      class:message-warning={type === "warning"}
      class:message-success={type === "success"}
      bind:this={messageComponent}
    >
      {#if isDismissible}
        <span class="closebtn" on:click={handleClose}>&times;</span>
      {/if}    
      {message}
    </div>
  {/if}
  
  <style>
    .message {
      padding: 20px;
      color: white;
    }
  
    .message-error {
      background-color: #f44336;
    }
  
    .message-success {
      background-color: #04AA6D;;
    }
  
    .message-warning {
      background-color: #ff9800;
    }
  
    .message-info {
      background-color: #2196F3;;
    }
  
    .closebtn {
      margin-left: 15px;
      color: white;
      font-weight: bold;
      float: right;
      font-size: 22px;
      line-height: 20px;
      cursor: pointer;
      transition: 0.3s;
    }
  
    .closebtn:hover {
      color: black;
    }
  </style>
  