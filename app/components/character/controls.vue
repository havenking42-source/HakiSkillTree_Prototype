<script setup lang="ts">
import { useCharacterStore } from '~/stores/character';
const character = useCharacterStore();
//character.characterName;

</script>

<template>
  <div class="join">
    Character Name: <UInput v-model="character.characterName" placeholder="Enter Character Name"/>
    
    Initial Armament Haki Pool: <UInput v-model="character.armamentHakiPool" type="number"/>
    
    Initial Armament Haki Cap: <UInput v-model="character.armamentHakiCapacity" type="number"/>
    
    Total Haki Points: <UInput v-model="character.totalHakiPoints" type="number"/>
  </div>
</template>