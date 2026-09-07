/**
 * database/seed.ts — script de seed inicial
 * Cria índices geoespaciais e insere localizações de Moçambique.
 *
 * Uso: npx tsx database/seed.ts
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/websiteminimax';

const MonitoredLocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  province: String,
  coords: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lon, lat]
  },
  population: Number,
  active: { type: Boolean, default: true },
});

MonitoredLocationSchema.index({ coords: '2dsphere' });

const MonitoredLocation = mongoose.model('MonitoredLocation', MonitoredLocationSchema);

const CITIES = [
  { name: 'Maputo',      province: 'Maputo cidade', coords: [32.5728, -25.9692], population: 1_101_000 },
  { name: 'Beira',       province: 'Sofala',        coords: [34.8386, -19.8436], population:   546_000 },
  { name: 'Nampula',     province: 'Nampula',       coords: [39.2667, -15.1167], population:   743_000 },
  { name: 'Quelimane',   province: 'Zambézia',      coords: [36.8868, -17.8786], population:   246_000 },
  { name: 'Inhambane',   province: 'Inhambane',     coords: [35.3833, -23.8667], population:    86_000 },
  { name: 'Xai-Xai',     province: 'Gaza',          coords: [33.6472, -25.0519], population:   129_000 },
  { name: 'Chimoio',     province: 'Manica',        coords: [33.4833, -19.1167], population:   290_000 },
  { name: 'Tete',        province: 'Tete',          coords: [33.5833, -16.1500], population:   305_000 },
  { name: 'Lichinga',    province: 'Niassa',        coords: [35.2400, -13.3128], population:   205_000 },
  { name: 'Pemba',       province: 'Cabo Delgado',  coords: [40.5167, -12.9667], population:   201_000 },
];

async function seed() {
  console.log('🌍 A conectar ao MongoDB…');
  await mongoose.connect(MONGODB_URI);

  console.log(`📍 A inserir ${CITIES.length} cidades…`);
  for (const c of CITIES) {
    await MonitoredLocation.updateOne(
      { name: c.name },
      { $set: c },
      { upsert: true },
    );
  }
  console.log('✓ Seed concluído.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('✗ Erro no seed:', err);
  process.exit(1);
});
