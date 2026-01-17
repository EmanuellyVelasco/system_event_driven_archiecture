## Tratamento de Falhas e Dead Letter Queue (DLQ)

Implementamos um mecanismo de tolerância a falhas para evitar que erros de processamento interrompam o fluxo da aplicação. Quando ocorre uma falha, o pedido é redirecionado para uma **Dead Letter Queue (DLQ)**, permitindo tratamento e verificação manual sem impactar os demais processos.

### Visão Geral

A API externa de imagens pode apresentar instabilidade, ocasionando falhas em parte das requisições. Para simular esse cenário, o worker (`Fetcher Worker`) lança erros de forma controlada em aproximadamente **30% das execuções**.

### Fluxo de Processamento

### Fluxo de Sucesso

- O worker executa normalmente.
- O pedido segue para a etapa de geração de PDF (`process:gen_pdf`).

### Fluxo de Erro

- O erro é capturado em um bloco `try/catch`.
- O erro é registrado no console.
- O status do pedido é atualizado para **failed** no banco de dados.
- O ID do pedido é publicado no canal **`process:failed`** (DLQ).

### Dead Letter Queue (DLQ)

Foi criado um **worker dedicado para a DLQ**, responsável por escutar o canal `process:failed`.

Ao receber um pedido com falha, o sistema registra um **log de alerta crítico**, indicando que o pedido necessita de verificação manual.

O arquivo principal (`main.ts`) é responsável por assinar o canal da DLQ e acionar o processador de falhas.

### Resultado

- A maioria dos pedidos é processada com sucesso.
- Pedidos afetados pela simulação de erro são corretamente redirecionados para a DLQ.
- O status final desses pedidos no banco de dados é **failed**, garantindo consistência e rastreabilidade.

## Instalação e Execução

Abra o VSCode na raiz do projeto. Em seguida abra o terminal e siga os passos abaixo:

1.  Instale as dependências:
    ```bash
    npm install
    ```

2.  Prepare o Banco de Dados (SQLite):
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```

3.  Execute o projeto:
    ```bash
    npm run dev
    ```

## Como Testar

1.  Acesse `http://localhost:3000`.
2.  Preencha o e-mail e clique em "Enviar Relatório".
3.  Acompanhe os logs no terminal (`[Fetcher]`, `[PDF]`, `[Email]`).
4.  Quando finalizar, clique no link do **Ethereal** gerado no log para visualizar o e-mail "fake" com o anexo.
