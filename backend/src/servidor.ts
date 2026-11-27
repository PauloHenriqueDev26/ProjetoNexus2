// Ponto de entrada do backend: conecta os componentes e mantém os processos em execução.
// Importa o gerador de recorrências para criar lançamentos futuros automaticamente.
// Importa a instância do aplicativo Express já configurada com middlewares e rotas.
import { gerarRecorrencias } from "./servicos/recorrencias";
import { aplicativo as app } from "./aplicativo";
import { configuracao } from "./config/configuracao";
import { bancoDados } from "./bancoDados/bancoDados";

// Realiza as inicializações necessárias antes de colocar o servidor HTTP disponível.
async function iniciar(): Promise<void> {
  // Permite enviar fotos de até 2 MB em uma única instrução preparada do MySQL.
  try {
    await bancoDados.query('SET GLOBAL max_allowed_packet = 16777216');
  } catch (falha) {
    console.warn('Não foi possível aumentar max_allowed_packet globalmente:', falha);
  }

  // SELECT 1 funciona como uma verificação rápida: se a consulta falhar, o servidor não inicia.
  await bancoDados.query('SELECT 1');

  // Executa uma geração imediata para não esperar pela primeira execução agendada.
  await gerarRecorrencias();

  // Impede execuções simultâneas caso a geração anterior demore mais que uma hora.
  let executando = false;
  setInterval(async () => {
    if (executando) return;
    executando = true;

    try {
      // Gera novamente todas as recorrências pendentes uma vez por hora.
      await gerarRecorrencias();
    } catch (falha) {
      console.error('Falha ao gerar recorrências:', falha);
    } finally {
      // Permite uma nova tentativa após esta execução terminar.
      executando = false;
    }
  }, 60 * 60 * 1000).unref(); // unref evita que o timer sozinho mantenha o processo ativo.

  // Coloca a API para receber conexões na porta definida pelas variáveis de ambiente.
  app.listen(configuracao.porta, () => {
    console.log(`API Nexus Finance rodando em http://localhost:${configuracao.porta}`);
  });
}

// Captura falhas da inicialização e encerra o processo com código de erro.
iniciar().catch(falha => {
  console.error('Não foi possível iniciar o backend:', falha);
  process.exit(1);
});
