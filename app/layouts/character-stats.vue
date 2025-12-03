<script setup lang="ts">
  import { useCharacterStore } from '#imports';
  const character = useCharacterStore();
</script>

<template>
  <USlideover :dismissible="false" :modal="false" title="Character Stats">
    <UButton label="Character Stats" color="neutral" variant="subtle" />

    <template #body>
      <UCard>
        <template #header>
          {{ character.characterName }}
        </template>

        <UContainer v-model="character.armamentHakiPool">Armament Haki Pool: {{ character.armamentHakiPool }}</UContainer>
        <UContainer v-model="character.armamentHakiCapacity">Armament Haki Pool: {{ character.armamentHakiCapacity }}</UContainer>
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
  </USlideover>
</template>