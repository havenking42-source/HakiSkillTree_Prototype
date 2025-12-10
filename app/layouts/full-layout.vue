<script setup lang="ts">
import CharacterControls from '../components/character/controls.vue';
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-4" type="checkbox" class="drawer-toggle" >
    <div class="drawer-content">
      <!-- Navbar -->
      <nav class="navbar w-full bg-base-300">
        <label for="my-drawer-4" aria-label="open sidebar" class="btn btn-square btn-ghost">
          <!-- Sidebar toggle icon -->
          <Icon name="tabler:layout-sidebar-left-expand" size="16" />
        </label>
          <CharacterControls/>
      </nav>
      <!-- Page content here -->
      <div class="p-4">Page Content</div>
    </div>

    <div class="drawer-side is-drawer-close:overflow-visible">
      <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
      <div class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
        <!-- Sidebar content here -->
        <ul class="menu w-full grow">
          <li>
            <button class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Armament">
              <!-- Armament icon -->
              <Icon name="tabler:swords" size="16"/>
              <span class="is-drawer-close:hidden">Observation Haki</span>
            </button>
          </li>
          <!-- List item -->
          <li>
            <button class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Observation">
              <!-- Observation icon -->
              <Icon name="tabler:eye" size="16"/>
              <span class="is-drawer-close:hidden">Observation Haki</span>
            </button>
          </li>

          <!-- List item -->
          <li>
            <button class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Conquerers">
              <!-- Conquerer's icon -->
              <Icon name="tabler:crown" size="16"/>
              <span class="is-drawer-close:hidden">Conquerer's Haki</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>