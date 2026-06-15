import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const questions = [
  // CUSTO - 5 perguntas
  {
    area: "CUSTO",
    subArea: "Orçamento",
    module: "Composição de Custos",
    order: 1,
    text: "A empresa possui processo formalizado de elaboração de orçamentos antes do início de cada obra?",
    suggestedParam: "Sim / Parcialmente / Não",
    activePP: true,
  },
  {
    area: "CUSTO",
    subArea: "Orçamento",
    module: "Composição de Custos",
    order: 2,
    text: "Quais são as principais fontes de dados utilizadas para composição do custo unitário de insumos (CUB, SINAPI, tabela própria)?",
    suggestedParam: "CUB / SINAPI / Tabela Própria / Cotação Direta",
    activePP: true,
  },
  {
    area: "CUSTO",
    subArea: "Controle de Custos",
    module: "Acompanhamento",
    order: 3,
    text: "Existe controle de custo real versus custo orçado durante a execução da obra? Com qual periodicidade?",
    suggestedParam: "Semanal / Quinzenal / Mensal / Não realiza",
    activePP: true,
  },
  {
    area: "CUSTO",
    subArea: "Controle de Custos",
    module: "Desvios",
    order: 4,
    text: "Quando há desvio significativo entre custo previsto e realizado, qual é o processo de análise de causa e ação corretiva?",
    suggestedParam: "Processo documentado / Informal / Não possui",
    activePP: true,
  },
  {
    area: "CUSTO",
    subArea: "Encerramento",
    module: "Análise de Resultado",
    order: 5,
    text: "A empresa realiza análise de resultado financeiro ao encerrar cada obra, comparando margem prevista versus realizada?",
    suggestedParam: "Sempre / Às vezes / Nunca",
    activePP: true,
  },

  // COMERCIAL - 5 perguntas
  {
    area: "COMERCIAL",
    subArea: "Prospecção",
    module: "Funil de Vendas",
    order: 1,
    text: "A empresa possui processo definido para prospecção de novos clientes e oportunidades de obra?",
    suggestedParam: "Processo formal / Informal / Não possui",
    activePP: true,
  },
  {
    area: "COMERCIAL",
    subArea: "Proposta",
    module: "Elaboração",
    order: 2,
    text: "Qual é o tempo médio de elaboração de uma proposta comercial desde o recebimento do escopo até o envio ao cliente?",
    suggestedParam: "< 3 dias / 3 a 7 dias / > 7 dias",
    activePP: true,
  },
  {
    area: "COMERCIAL",
    subArea: "Proposta",
    module: "Aprovação Interna",
    order: 3,
    text: "Existe processo de aprovação interna das propostas comerciais antes do envio ao cliente (validação de margens, escopo, riscos)?",
    suggestedParam: "Sim, formalizado / Sim, informal / Não",
    activePP: true,
  },
  {
    area: "COMERCIAL",
    subArea: "Negociação",
    module: "Gestão do Contrato",
    order: 4,
    text: "Como a empresa controla as negociações em aberto — existe CRM ou sistema de acompanhamento de pipeline comercial?",
    suggestedParam: "CRM dedicado / Planilha / Não controla",
    activePP: true,
  },
  {
    area: "COMERCIAL",
    subArea: "Pós-venda",
    module: "Relacionamento",
    order: 5,
    text: "A empresa realiza ações estruturadas de pós-venda ou relacionamento com clientes após o encerramento de obras?",
    suggestedParam: "Sim, sistematizado / Esporadicamente / Não realiza",
    activePP: true,
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.question.deleteMany();

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Created ${questions.length} questions`);
  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
