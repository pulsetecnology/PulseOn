import { storage } from './storage';

async function main() {
  try {
    console.log('Buscando usuários...');
    const users = await storage.getUsers();
    console.log('Usuários encontrados:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  }
}

main();