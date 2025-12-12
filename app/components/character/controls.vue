<script setup lang="ts">
import { useCharacterStore } from '~/stores/character';
const character = useCharacterStore();
//character.characterName;

</script>

<template>
  <div class="join">
    Character Name: <input v-model="character.characterName" placeholder="Enter Character Name" class="input input-ghost input-sm w-1/6"/>
    
    Initial Armament Haki Pool: <input v-model="character.armamentHakiPool" type="number" class="input input-ghost input-sm w-1/16"/>
    
    Initial Armament Haki Cap: <input v-model="character.armamentHakiCapacity" type="number" class="input input-ghost input-sm w-1/16"/>
    
    Total Haki Points: <input v-model="character.totalHakiPoints" type="number" class="input input-ghost input-sm w-1/16"/>
  </div>
</template>