# CPSI da AAPVR

![CPSI da AAPVR](https://www.aapvr.org.br/wp-content/uploads/2023/08/LOGO-HORIZONTAL-COLORIDO.png)

> Um sistema moderno e eficiente para a gestão da **Associação de Aposentados e Pensionistas de Volta Redonda (AAPVR)**.

## 📌 Tecnologias Utilizadas

### 💻 Frontend
- **Next.js** - Framework React para aplicações web rápidas e escaláveis.
- **ShadCN** - Componentes UI modernos e acessíveis.
- **Tailwind CSS** - Estilização rápida e eficiente.

### 🖥️ Backend
- **Node.js** - Plataforma para execução do código JavaScript no servidor.
- **Express.js** - Framework para construção de APIs rápidas e escaláveis.
- **PostgreSQL / MySQL** - Banco de dados relacional para armazenamento seguro.

## 🚀 Funcionalidades Principais
✅ Gerenciamento de usuários e permissões.  
✅ Controle de associados e pensionistas.  
✅ Emissão de relatórios detalhados.  
✅ Integração com APIs de terceiros.  
✅ Dashboard intuitivo com gráficos dinâmicos.  
✅ Suporte para autenticação segura com JWT.  

## 🎯 Como Rodar o Projeto

### 🏗️ Pré-requisitos
Antes de iniciar, certifique-se de ter instalado:
- **Node.js** (versão 18+)
- **Yarn ou NPM**
- **Banco de Dados PostgreSQL ou MySQL**

### 🔧 Instalação
1. **Clone o repositório**
   ```sh
   git clone https://github.com/seuusuario/gestor-aapvr.git
   cd cpsi-aapvr
   ```

2. **Instale as dependências do frontend**
   ```sh
   cd frontend
   yarn install  # ou npm install
   ```

3. **Configure as variáveis de ambiente do frontend**
   Crie um arquivo `.env.local` na pasta `frontend` e adicione:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Execute o frontend**
   ```sh
   yarn dev  # ou npm run dev
   ```

5. **Instale as dependências do backend**
   ```sh
   cd ../backend
   yarn install  # ou npm install
   ```

6. **Configure as variáveis de ambiente do backend**
   Crie um arquivo `.env` na pasta `backend` e adicione:
   ```env
   PORT=5000
   DATABASE_URL=postgres://usuario:senha@localhost:5432/gestor_aapvr
   JWT_SECRET=sua_chave_secreta
   ```

7. **Execute o backend**
   ```sh
   yarn dev  # ou npm run dev
   ```

Agora, o sistema estará rodando em:  
🔗 **Frontend:** [`http://localhost:3000`](http://localhost:3000)  
🔗 **Backend:** [`http://localhost:5000`](http://localhost:5000)

## 🛠️ Estrutura do Projeto
```
📂 cpsi-aapvr
 ┣ 📂 frontend (Next.js + ShadCN + Tailwind CSS)
 ┃ ┣ 📂 components
 ┃ ┣ 📂 pages
 ┃ ┣ 📂 styles
 ┃ ┗ next.config.js
 ┣ 📂 backend (Node.js + Express + PostgreSQL)
 ┃ ┣ 📂 controllers
 ┃ ┣ 📂 models
 ┃ ┣ 📂 routes
 ┃ ┗ server.js
 ┗ README.md
```

## 📜 Licença
Este projeto está sob a licença **MIT**. Sinta-se à vontade para usá-lo e contribuir!  

---

💡 *Contribua com melhorias e sugestões para tornar o Gestor da AAPVR ainda melhor!* 🚀
