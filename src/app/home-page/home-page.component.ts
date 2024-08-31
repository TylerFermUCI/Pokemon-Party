import { Component, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import { PredictionEvent } from '../prediction-event';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  // Getting the gesture.
  gesture: String = "";
  
  // An array that contains the current pokemon on screen.
  currentPokemon: Array<any> = []

  // Store whether display pokemon is shiny.
  display_pokemon_shiny: Array<boolean> = []

  // Store the ability of each display pokemon.
  display_pokemon_ability: Array<any> = []
  display_pokemon_ability_descriptions: Array<any> = []

  // Store information about the selected party pokemon.
  party_pokemon: Array<any> = []
  
  // Store whether the selected party pokemon is shiny or not.
  shiny_party_pokemon: Array<any> = []

  // Store which display pokemon is currently selected.
  selected_display_pokemon: any
  pokemon_index: number
  
  // Store the newest pokemon.
  newest_pokemon: any
  newest_pokemon_index: number = -1
  newest_found: boolean = false
  
  constructor() { }

  ngOnInit(): void {
    this.currentPokemon = this.getPokemon();
  }

  prediction(event: PredictionEvent){
    this.gesture = event.getPrediction();
    
    // Use the basic gestures.
    if (this.gesture === "Open Hand" && this.party_pokemon.length < 6) {this.click_display_pokemon(0);}
    else if (this.gesture === "Closed Hand" && this.party_pokemon.length < 6) {this.click_display_pokemon(1);}
    else if (this.gesture === "Hand Pointing" && this.party_pokemon.length < 6) {this.click_display_pokemon(2);}
    else if (this.gesture === "Two Open Hands" && this.selected_display_pokemon != undefined) {this.add_to_party();}
    else if (this.gesture === "Two Closed Hands" && this.party_pokemon.length >= 6) {this.click_Restart();}
    // Use custom gestures.
    else if (this.gesture === "Hand Pointing Hand Pinching" && this.party_pokemon.length >= 6) {this.make_shiny();}
    else if (this.gesture === "Hand Open Hand Closed" && this.party_pokemon.length >= 6) {this.get_Newest();}
  }

  // Generate a new set of display pokemon.
  click_Restart(): void {
    // Reset necessary variables.
    this.shiny_party_pokemon = [];
    this.party_pokemon = [];
    this.newest_pokemon = undefined
    this.newest_pokemon_index = -1
    this.newest_found = false
    // Get 3 new pokemon.
    this.currentPokemon = this.getPokemon();
  }

  // Update the selected display pokemon based on which display pokemon was clicked on.
  click_display_pokemon(selected_number: number): void {
    this.selected_display_pokemon = this.currentPokemon[selected_number];
    this.pokemon_index = selected_number;
  }

  // Add the selected Pokemon to the party.
  add_to_party(): void {
    // Add the selected pokemon to the party.
    this.party_pokemon.push(this.selected_display_pokemon);
    this.shiny_party_pokemon.push(this.display_pokemon_shiny[this.pokemon_index]);
    // Get 3 more pokemon.
    this.currentPokemon = this.getPokemon();
  }

  // Get 3 random pokemon from PokeAPI.
  getPokemon(): Array<any> {
    // Reset necessary variables.
    let randomPokemon: Array<any> = [];
    this.display_pokemon_shiny = [];
    this.display_pokemon_ability = [];
    this.display_pokemon_ability_descriptions = [];
    this.selected_display_pokemon = undefined;
    this.pokemon_index = -1;
    // Get 3 random pokemon.
    for (let i = 0; i < 3; i++){
      // Get the data about the randomly generated pokemon.
      let pokemon_id = Math.floor(Math.random() * 1007) + 1;
      let pokeAPI_url = `https://pokeapi.co/api/v2/pokemon/${pokemon_id}`;
      fetch(pokeAPI_url).then( (data) => data.json()).then( (pokemon) => {
        randomPokemon.push(pokemon);
        
        // Determine if the pokemon should be displayed shiny.
        if (pokemon.sprites.front_shiny == null) {this.display_pokemon_shiny.push(false);}
        else {this.display_pokemon_shiny.push((Math.floor(Math.random() * 3999) + 1) === 1);}

        // Choose the ability.
        let ability_index = pokemon_id % pokemon.abilities.length;
        this.display_pokemon_ability.push(pokemon.abilities[ability_index]);

        // Get the description of the ability given.
        fetch(pokemon.abilities[ability_index].ability.url).then( (data) => data.json()).then( (response) => {
          // Find the english description.
          let found = false
          for (let x = 0; x < response.effect_entries.length; x++) {
            if (response.effect_entries[x].language.name === 'en') {
              this.display_pokemon_ability_descriptions.push(response.effect_entries[x].short_effect);
              found = true
              break;
            }
          }
          if (found == false) {this.display_pokemon_ability_descriptions.push("No description found.")}
        });
      });
    }
    return randomPokemon
  }

  // Get the types of the given pokemon.
  getTypes(pokemon: any): Array<String>{
    let type_image_urls: Array<String> = [];
    // Loop through all the types.
    for (let i = 0; i < pokemon.types.length; i++) {
      let type = pokemon.types[i].type.name.charAt(0).toUpperCase() + pokemon.types[i].type.name.slice(1);
      type_image_urls.push(`/assets/pokemon_type_icons/Pokemon_Type_Icon_${type}.png`);
    }
    return type_image_urls;
  }

  // Extract the name of the type from a path string.
  extractTypeFromString(type_string: String): String {
    // Extracts the type of the pokemon from the path.
    return type_string.substring(47, type_string.indexOf('.')) + " type icon";
  }

  // Replace dashes with spaces.
  replaceDashes(str: String): String {
    return str.replace('-', ' ');
  }

  // Return a named gesture based on a given number.
  choose_Gesture(num: number): String {
    if (num == 0) {return "Open Hand";}
    else if (num == 1) {return "Closed Hand";}
    else {return "Hand Pointing";}
  }

  // Save the screen as an image.
  save_party_as_image() {
    html2canvas(document.body).then(canvas => {
      document.body.appendChild(canvas);
    })
  }

  // Make the party pokemon appear shiny.
  make_shiny() {
    for (let i = 0; i < this.party_pokemon.length; i++) {
      if (this.party_pokemon[i].sprites.front_shiny != null) {this.shiny_party_pokemon[i] = true;}
    }
  }

  // Get the newest pokemon (in terms of which generation it came from) on the team.
  get_Newest(): void {
    let newest_id = 0
    for (let i = 0; i < this.party_pokemon.length; i++) {
      if (this.party_pokemon[i].id >= newest_id) {
        newest_id = this.party_pokemon[i].id
        this.newest_pokemon = this.party_pokemon[i]
        this.newest_pokemon_index = i
      }
    }
    this.newest_found = true
  }
}
