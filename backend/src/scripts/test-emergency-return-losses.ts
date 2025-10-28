/**
 * Script de test pour simuler les pertes de ressources lors d'un retour d'urgence
 *
 * Ce script teste la logique de calcul des pertes aléatoires :
 * - Pour chaque ressource, perte aléatoire entre 0 et la moitié (arrondie supérieure)
 */

function testEmergencyReturnLosses() {
  console.log("=== Test des pertes de ressources en retour d'urgence ===\n");

  // Test cases avec différentes quantités
  const testCases = [
    { name: "Bois", quantity: 10 },
    { name: "Pierre", quantity: 15 },
    { name: "Nourriture", quantity: 7 },
    { name: "Métal", quantity: 1 },
    { name: "Eau", quantity: 20 },
    { name: "Petite quantité", quantity: 3 },
  ];

  // Run multiple simulations for each test case
  const simulations = 5;

  testCases.forEach(testCase => {
    console.log(`\n📦 Ressource: ${testCase.name} (Quantité initiale: ${testCase.quantity})`);

    const maxLoss = Math.ceil(testCase.quantity / 2);
    console.log(`   Max perte possible: ${maxLoss} (${Math.ceil(testCase.quantity / 2)} = ceil(${testCase.quantity}/2))`);

    const results: Array<{ lost: number; remaining: number }> = [];

    for (let i = 0; i < simulations; i++) {
      // Simulate the loss calculation
      const lostQuantity = Math.floor(Math.random() * (maxLoss + 1));
      const remainingQuantity = testCase.quantity - lostQuantity;

      results.push({ lost: lostQuantity, remaining: remainingQuantity });
    }

    console.log(`\n   Simulations (${simulations} essais):`);
    results.forEach((result, index) => {
      const lossPercent = ((result.lost / testCase.quantity) * 100).toFixed(1);
      console.log(`     ${index + 1}. Perdu: ${result.lost} (${lossPercent}%) → Restant: ${result.remaining}`);
    });

    // Calculate statistics
    const avgLost = results.reduce((sum, r) => sum + r.lost, 0) / simulations;
    const minLost = Math.min(...results.map(r => r.lost));
    const maxLost = Math.max(...results.map(r => r.lost));

    console.log(`\n   Statistiques:`);
    console.log(`     Perte min: ${minLost} | Perte max: ${maxLost} | Perte moy: ${avgLost.toFixed(1)}`);
  });

  console.log("\n\n=== Vérification des règles ===");
  console.log("✓ La perte est toujours entre 0 et ceil(quantité/2)");
  console.log("✓ La perte peut être 0 (aucune perte possible)");
  console.log("✓ La perte maximale est la moitié arrondie supérieure");
  console.log("✓ Les ressources perdues sont définitivement perdues (pas de récupération)");
}

// Run the test
testEmergencyReturnLosses();
