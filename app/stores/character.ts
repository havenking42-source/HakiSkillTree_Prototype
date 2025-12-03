import {defineStore} from 'pinia';

export const useCharacterStore = defineStore('character', {
  state: () => {
    return {
      characterName: '',
      armamentHakiPool: 0,
      armamentHakiCapacity: 0,
      armamentOffenseDice: 'd1',
      armamentDefenseDice: 'd1',
      observationFocusModifier: 0,
      observationRange: 0,
      totalHakiPoints: 0,
      conquerorAwakened: false,
      armamentSkills: [] as string[],
      observationSkils: [] as string[],
      conquerorSkills: [] as string[],
    }
  },

  actions: {
    setCharacterName(name: string) {
      this.characterName = name;
    },
    incrementArmamentHakiPool() {
      this.armamentHakiPool++;
    },
    decrementArmamentHakiPool() {
      if (this.armamentHakiPool > 0) {
        this.armamentHakiPool--;
      }
    },
    incrememtArmamentHakiCapacity() {
      this.armamentHakiCapacity++;
    },
    decrementArmamentHakiCapacity() {
      if (this.armamentHakiCapacity > 0) {
        this.armamentHakiCapacity--;
      }
    },
    setArmamentDice(type: 'offense' | 'defense', dice: string) {      
      if (type === 'offense') {
        this.armamentOffenseDice = dice;
      } else {
        this.armamentDefenseDice = dice;
      }      
    },
    incrementObservationFocusModifier(increase: number) {
      this.observationFocusModifier += increase;
    },
    decrementObservationFocusModifier(decrease: number) {
      this.observationFocusModifier -= decrease; 
      if (this.observationFocusModifier < 0) {
        this.observationFocusModifier = 0;
      }
    },
    incrementObservationRange(increase: number) {
      this.observationRange++;
    },
    decrementObservationRange(decrease: number) {
      if (this.observationRange > 0) {
        this.observationRange--;
      }
    },
    incrementTotalHakiPoints() {
      this.totalHakiPoints++;
    },
    decrementTotalHakiPoints() {
      if (this.totalHakiPoints > 0) {
        this.totalHakiPoints--;
      }
    },
  },

  //TODO: getters
  getters: {
    getCharacterName(state) {
      return state.characterName;
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCharacterStore, import.meta.hot))
}