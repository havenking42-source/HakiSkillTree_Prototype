<script setup lang="ts">
import { useCharacterStore } from '~/stores/character';
const character = useCharacterStore();
//character.characterName;

</script>

<template>
  <UForm>
    <UFormField label="Character Name">
      <UInput v-model="character.characterName" placeholder="Enter Character Name"/>
    </UFormField>
    <UFormField label="Initial Armament Haki Pool">
      <UInput v-model="character.armamentHakiPool" type="number"/>
    </UFormField>
    <UFormField label="Initial Armament Haki Cap">
      <UInput v-model="character.armamentHakiCapacity" type="number"/>
    </UFormField>
    <UFormField label="Total Haki Points">
      <UInput v-model="character.totalHakiPoints" type="number"/>
    </UFormField>
  </UForm>
</template>