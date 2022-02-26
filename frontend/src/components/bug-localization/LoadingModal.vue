<template>
  <div ref="loadingModal" class="modal" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body d-flex justify-content-center">
          <div
            class="spinner-grow text-info"
            style="width: 5rem; height: 5rem"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Modal } from "bootstrap";
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "LoadingModal",
  computed: {
    ...mapState(["isLoading"]),
  },
  watch: {
    isLoading() {
      const loadingModal = Modal.getOrCreateInstance(
        this.$refs.loadingModal as HTMLDivElement
      );
      if (this.isLoading) {
        loadingModal.show();
      } else {
        loadingModal.hide();
      }
    },
  },
});
</script>
<style scoped>
.modal-content {
  background-color: transparent;
  border: none;
}
</style>
