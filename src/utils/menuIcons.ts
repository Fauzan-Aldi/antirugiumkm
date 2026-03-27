export function getMenuIcon(name: string, category: string): string {
  const text = (name + ' ' + category).toLowerCase();

  if (text.includes('nasi')) return '🍚';
  if (text.includes('kopi') || text.includes('coffee')) return '☕';
  if (text.includes('teh') || text.includes('tea')) return '🍵';
  if (text.includes('mie') || text.includes('noodle') || text.includes('indomie')) return '🍜';
  if (text.includes('ayam') || text.includes('chicken')) return '🍗';
  if (text.includes('ikan') || text.includes('fish')) return '🐟';
  if (text.includes('roti') || text.includes('bread')) return '🍞';
  if (text.includes('minum') || text.includes('jus') || text.includes('juice') || text.includes('es')) return '🥤';
  if (text.includes('camilan') || text.includes('snack') || text.includes('goreng')) return '🥟';
  if (text.includes('burger')) return '🍔';
  if (text.includes('pizza')) return '🍕';
  if (text.includes('sate')) return '🍢';
  if (text.includes('bakso')) return '🥣';
  
  // Default berdasarkan kategori jika tidak ada kata kunci nama
  if (category.toLowerCase().includes('makanan')) return '🍽️';
  if (category.toLowerCase().includes('minuman')) return '🍹';
  
  return '📦'; // Default icon
}
