# Asteroids Arcade V2

## Project Overview
Build a futuristic planetary asteroid survival game using HTML, CSS, and JavaScript.

## Spaceship
- Design a futuristic spaceship made from three connected triangular sections.
- Support rotation, forward thrust, momentum, and shooting.
- Add glowing engine effects and visual damage effects.

## Planetary Background
- Show a large, detailed planet with an atmospheric glow.
- Include asteroids, lighting, and space effects.
- Keep gameplay objects easy to see.

## Asteroids
- Asteroids bounce off each other using collision physics.
- Some asteroids explode when hit by projectiles.
- Large asteroids can split into smaller asteroids.
- Different asteroid types have different behaviors.

## Weapons and Orbs
- Collect orbs that change the spaceship's weapon.
- Include rapid fire, spread shots, piercing shots, and explosive shots.
- Show the currently active weapon.
- Give temporary power-ups a visible duration.

## Score and Upgrades
- Award points for destroying asteroids.
- Offer an upgrade opportunity at every 3,000-point milestone.
- Upgrade options include weapon damage, firing speed, thrust, and shields.
- Allow the player to choose an upgrade.

## Rounds and Difficulty
- Include 500 rounds.
- Increase difficulty progressively in each round.
- Adjust asteroid numbers, speed, toughness, and special types.
- Display the current round.
- Show a victory screen after round 500.

## Lives
- Start with 20 lives.
- Reduce lives when the ship is destroyed.
- Provide temporary invulnerability after respawning.
- End the game when all lives are lost.

## Controls
- Left Arrow: Rotate left.
- Right Arrow: Rotate right.
- Up Arrow: Move forward.
- Spacebar: Shoot.
- P: Pause or resume.

## Interface
- Start screen
- Score and lives display
- Round counter
- Weapon and upgrade indicators
- Pause menu
- Game-over screen
- Victory screen

## Technical Requirements
- Use HTML, CSS, and JavaScript.
- Separate the code into index.html, style.css, and game.js.
- Support modern desktop browsers.
- Optimize animation and collision detection for smooth gameplay.
- Make the game playable at different screen sizes.

## Acceptance Criteria
- All controls work correctly.
- Asteroids bounce and collide properly.
- Explosive asteroids react to shots.
- Orbs change weapons.
- Upgrades become available at every 3,000-point milestone.
- The game starts with 20 lives.
- All 500 rounds are playable.
- Difficulty increases progressively.
- Pause, restart, game-over, and victory states work.

## Development Plan
1. Build the game screen and planetary background.
2. Implement the spaceship design and physics.
3. Add asteroids and collisions.
4. Add shooting and explosive asteroid types.
5. Add weapon orbs.
6. Implement score, lives, and upgrades.
7. Add 500 rounds and progressive difficulty.
8. Test and publish with GitHub Pages.

## V2.1 - Bosses, Gold, Shop, and Difficulty

### Boss Battles
- Add boss enemies with visible health bars.
- Bosses require many hits to defeat.
- Bosses become harder as the player progresses.
- Bosses use attacks that the player must dodge.

### Stronger Asteroids
- Small asteroids require 2-3 hits.
- Medium asteroids require 4-6 hits.
- Large asteroids require 8 or more hits.
- Asteroids show damage through visual changes.
- Rare golden asteroids drop gold when destroyed.

### Gold System
- Gold is a currency separate from score.
- Destroying golden asteroids rewards gold.
- Display the player's gold balance on the HUD.
- Gold stays available to spend throughout the game.

### Upgrade Shop
- Open the shop every 5,000 points.
- Pause gameplay while the shop is open.
- Allow players to spend gold on upgrades and items.
- Include weapons, shields, extra lives, and damage upgrades.
- Show item prices and prevent purchases the player cannot afford.

### Helper Ships
- Allow players to buy companion ships with gold.
- Helper ships follow the player and automatically shoot asteroids.
- Additional helper ships can be purchased at higher prices.

### Increased Difficulty
- Increase asteroid count and speed over time.
- Increase asteroid health in later rounds.
- Make boss battles progressively harder.
- Keep the game challenging through the 500-round goal.

### Compatibility
- Keep existing movement, shooting, score, lives, and pause controls.
- Support keyboard controls and the existing game layout.
- Test every new feature before considering the update complete.
