# Contexto do projeto

Desafio técnico mobile da Sempher Solutions (vaga de Desenvolvedor Mobile Júnior).
App React Native (Expo) de produtos e carrinho, com funcionamento online e offline,
persistência em SQLite e sincronização de operações pendentes com a API DummyJSON.

## Antes de qualquer tarefa
Leia `docs/PLANEJAMENTO.md`. Ele define as tabelas SQLite, o fluxo de sincronização,
a estrutura de pastas e a ordem de implementação. Siga o plano; se precisar divergir,
explique o motivo antes de mudar.

## Regras
- JavaScript puro. Não usar TypeScript.
- React Native com Expo, componentes funcionais e hooks. Estado com Context API.
- SQLite com `expo-sqlite`, conectividade com `@react-native-community/netinfo`.
- Código simples e legível, sem arquitetura além da prevista no plano.
- Comentários curtos em português onde a lógica não for óbvia.
- Não incluir credenciais, tokens ou dados pessoais em nenhum arquivo.

## Git
- Não faça commit nem push. Eu reviso e commito.
- Quando terminar uma etapa, sugira a mensagem de commit no formato `tipo: descrição`
  (em português, no imperativo: `feat:`, `fix:`, `docs:`, `chore:`).
- Faça mudanças pequenas, uma etapa do plano por vez.

## Objetivo de aprendizado
Eu preciso entender todo o código. Ao terminar cada etapa, explique em
poucas linhas o que foi feito e por quê.