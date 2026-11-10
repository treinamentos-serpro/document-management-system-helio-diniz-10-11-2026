# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário.
- Download de um documento pelo identificador.
- Associação simples dos documentos a um identificador de usuário.
- Armazenamento dos arquivos no filesystem local usando `multer` com `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do processo.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento, edição ou exclusão de documentos.
- Persistência dos metadados em banco de dados ou em arquivo.
- Cadastro, autenticação e autorização completos de usuários.
- Compartilhamento de documentos entre usuários.
- Upload de múltiplos arquivos em uma única requisição.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo por requisição `POST /upload`, usando `multipart/form-data` e o campo `file`. |
| RF-02 | O sistema deve rejeitar requisições sem arquivo, com arquivo vazio ou que excedam o limite configurado. |
| RF-03 | O sistema deve gerar um identificador único para cada documento e armazenar o arquivo com um nome interno que não dependa do nome enviado pelo usuário. |
| RF-04 | Após um upload bem-sucedido, o sistema deve retornar os metadados do documento criado. |
| RF-05 | O sistema deve listar somente os documentos associados ao usuário da requisição. |
| RF-06 | O sistema deve permitir baixar um documento pelo identificador, desde que esteja associado ao usuário da requisição. |
| RF-07 | O sistema deve retornar erro apropriado quando o documento não existir, não pertencer ao usuário ou não puder ser lido. |
| RF-08 | O nome original deve ser preservado nos metadados e usado como nome sugerido no download, sem ser usado para compor o caminho físico do arquivo. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase; eles não precisam sobreviver à reinicialização do processo. |
| RNF-03 | Porta, diretório de armazenamento e limite de upload devem ser configuráveis por variáveis de ambiente. |
| RNF-04 | O backend deve seguir o fluxo de dependências `routes -> controllers -> services -> repositories`. |
| RNF-05 | Falhas de validação, leitura e gravação devem ser tratadas nos limites apropriados, sem expor caminhos internos do servidor. |
| RNF-06 | O identificador gerado deve ser usado como nome físico do arquivo, evitando traversal e colisões causadas pelo nome original. |
| RNF-07 | A API deve responder em JSON para erros e metadados; o download deve responder com conteúdo binário. |

### Configuração proposta

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `DMS_STORAGE_DIR` | `backend/storage` | Diretório local para os arquivos enviados. |
| `DMS_MAX_UPLOAD_SIZE_BYTES` | `10485760` | Tamanho máximo por arquivo, em bytes; padrão de 10 MiB. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, preferencialmente UUID. |
| `originalName` | string | Nome original fornecido no upload, após validação e normalização para uso em cabeçalho HTTP. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em formato ISO 8601. |
| `owner` | string | Identificador do usuário associado ao documento. |
| `storedName` | string | Nome interno usado no filesystem; não deve ser exposto na resposta pública da API. |

O repositório mantém os metadados em memória, indexados por `id`. O arquivo correspondente é gravado em `DMS_STORAGE_DIR` usando um nome interno derivado do identificador, não de `originalName`.

### Identificação do usuário

Como o escopo não inclui autenticação, esta especificação assume que as requisições enviam `X-User-Id` como identificador do usuário. Esse valor serve apenas para associação funcional dos documentos e **não constitui autenticação ou controle de acesso seguro**. Uma implementação com usuários reais deve substituir esse mecanismo por identidade validada por autenticação.

## 6. Contratos de API

Todas as rotas abaixo são relativas à raiz do backend. As requisições de upload, listagem e download devem incluir `X-User-Id`.

### `POST /upload`

Envia um documento.

**Entrada**

- `Content-Type: multipart/form-data`
- Campo obrigatório: `file` (um arquivo)
- Cabeçalho obrigatório: `X-User-Id`

**Sucesso**

- Status: `201 Created`
- Corpo:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-10T12:00:00.000Z",
  "owner": "usuario-123"
}