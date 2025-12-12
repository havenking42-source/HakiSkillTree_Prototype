<script setup lang="ts">
  import { useCharacterStore } from '#imports';
  const character = useCharacterStore();
</script>

<template>
  <!-- <USlideover :dismissible="false" :modal="false" title="Character Stats">
    <UButton label="Character Stats" class="btn btn-primary" variant="subtle" />

    <template #body>
      <UCard>
        <template #header>
          {{ character.characterName }}
        </template>

        <UContainer v-model="character.armamentHakiPool">Armament Haki Pool: {{ character.armamentHakiPool }}</UContainer>
        <UContainer v-model="character.armamentHakiCapacity">Armament Haki Capacity: {{ character.armamentHakiCapacity }}</UContainer>
        <UContainer>Armament Haki Dice Type:
          <UContainer v-model="character.armamentOffenseDice">
            While Attacking: {{ character.armamentOffenseDice }}
          </UContainer>
          <UContainer v-model="character.armamentDefenseDice">
            While Defending: {{ character.armamentDefenseDice }}
          </UContainer>
        </UContainer>
        <USeparator/>
        <UContainer> Observation Haki:
          <UContainer v-model="character.observationFocusModifier">
          Focus Modifier: {{ character.observationFocusModifier }}
        </UContainer>
        <UContainer v-model="character.observationRange">
          Observation Range: {{ character.observationRange }}
        </UContainer>
        </UContainer>
      </UCard>
    </template>
  </USlideover> -->
  <div>
    <button aria-label="Character Stats" class="btn btn-primary" onclick="character_modal.show()">Character Stats</button>
    <dialog id="character_modal">
      <div>  
        
        <h3> Stats for {{ character.characterName }}</h3> 
        

        <div >Armament Haki Pool: {{ character.armamentHakiPool }}</div>
        <div >Armament Haki Capacity: {{ character.armamentHakiCapacity }}</div>

        <div>Armament Haki Dice Type:
          <div >
            While Attacking: {{ character.armamentOffenseDice }}
          </div>
          <div >
            While Defending: {{ character.armamentDefenseDice }}
          </div>
        </div>
        
        <div> Observation Haki:
          <div >
            Focus Modifier: {{ character.observationFocusModifier }}
          </div>
          <div >
            Observation Range: {{ character.observationRange }}
          </div>
        </div>
        <div class="modal-action">
          <!-- Button to close the modal -->
          <button class="btn" onclick="character_modal.close()">Close</button>
        </div>
      </div>
    </dialog>
    
      
    
  </div>
</template>

<style>
  dialog.modal::backdrop {
    background-color: rgba(0, 0, 0, 0.0);
  }
</style>