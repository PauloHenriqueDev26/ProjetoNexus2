# Revisão de organização e manutenção

## Alterações

- Componentes de animação e navegação movidos de `app/components` para `components`, com imports atualizados.
- Estilos removidos da árvore de rotas e divididos em cinco áreas, com tokens compartilhados e cache por paleta.
- Removidos 89 estilos sem referência, cinco variáveis sem uso, o componente `AnimatedPressable`, as validações de CPF não utilizadas pelo cadastro e seu teste específico. O campo CPF do banco foi preservado.
- Removidas as duas rotas vazias de edição de receita e despesa, suas declarações de navegação e seus títulos. Nenhuma edição funcional de lançamento foi removida.
- Removidas as imagens sem referência `icon.png`, `image.png` e `perfil.png`.
- Removidas as dependências `expo-symbols` e `react-native-ico-material-design`; as dependências de infraestrutura do Expo e da navegação foram preservadas.
- Removido o comando `reset-project`, cujo script não existia.
- Teste de máscara de data movido para `tests`; adicionado comando de testes do aplicativo.
- Comentários explicativos em português nos 76 módulos de código, com documentação das rotas, transações, concorrência, armazenamento e diferenças de plataforma.
- Prettier configurado na raiz, indentação de dois espaços e finais de linha LF; README e mapa de funcionalidades atualizados.

## Verificações

- 23 testes do backend passaram, incluindo os 17 testes de integração com MySQL e arquivos em banco temporário.
- 11 testes do aplicativo passaram.
- Lint sem erros ou avisos e verificação de formatação aprovada.
- Compilação TypeScript e exportações web, Android e iOS aprovadas.
- Conferidos 186 imports relativos; todos os destinos existem.
- Comparados 600 valores de estilo, somando as duas paletas: todos os estilos mantidos preservam seus valores anteriores.

## Limites

A validação automatizada não substitui o teste do teclado, seletor de arquivos e compartilhamento em aparelhos físicos. As tabelas e os dados persistidos do projeto não foram removidos; o SQL de instalação recebeu apenas ajustes de espaçamento.
