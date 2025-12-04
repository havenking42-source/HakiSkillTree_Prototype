<script setup lang="ts">
import { useCharacterStore } from '#imports';
const character = useCharacterStore();

function exportJSON() {
  const characterJSON = JSON.stringify(character.$state);
  const characterBlob = new Blob([characterJSON], {type: 'application/json'});
  const characterURL = URL.createObjectURL(characterBlob);
  const characterLink = document.createElement('a');
  characterLink.href = characterURL;
  characterLink.download = `${character.characterName}.json`;
  document.body.appendChild(characterLink);
  characterLink.click();
  document.body.removeChild(characterLink);
  URL.revokeObjectURL(characterURL); // Clean up the object URL
}
</script>

<template>
  <UButton @click="exportJSON">Export</UButton>
</template>