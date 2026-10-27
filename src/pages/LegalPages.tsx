import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useDocumentMeta } from '../lib/seo';
import { Link } from 'react-router-dom';

function LegalShell({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header hideMobileSearch />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 border-b border-[#DFB992]/20 pb-6">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[#DFB992] hover:underline">
            ← Voltar para o início
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#F5EDE4] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-xs text-[#8E7F70]">Última atualização: {lastUpdated}</p>
        </div>
        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-[#D5C7B8]">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function PrivacyPolicyPage() {
  useDocumentMeta('Política de Privacidade | Stories & Stickers', 'Conheça nossa política de privacidade e como protegemos seus dados.');

  return (
    <LegalShell title="Política de Privacidade" lastUpdated="27 de Outubro de 2026">
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">1. Introdução</h2>
        <p>
          O <strong>Stories &amp; Stickers</strong> valoriza a sua privacidade e está comprometido com a proteção dos seus dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos informações ao acessar e utilizar nossa plataforma web e aplicativo móvel (PWA).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">2. Informações que Coletamos</h2>
        <p>Podemos coletar as seguintes categorias de informações:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li>
            <strong>Dados de Cadastro:</strong> Nome, endereço de e-mail e senha criptografada quando você cria uma conta diretamente no aplicativo.
          </li>
          <li>
            <strong>Autenticação com o Google (Google Sign-In):</strong> Caso opte por entrar com o Google, coletamos apenas suas informações públicas básicas fornecidas pela API do Google: nome completo, endereço de e-mail verificado e foto de perfil. <em>Não solicitamos nem acessamos seus contatos, arquivos do Google Drive ou quaisquer outros dados privados da sua conta Google.</em>
          </li>
          <li>
            <strong>Dados de Transações e Pagamentos:</strong> Os pagamentos e assinaturas são processados de forma segura e direta pelo gateway do <strong>Mercado Pago</strong>. Nós não armazenamos os números completos do seu cartão de crédito ou dados bancários sensíveis em nossos servidores.
          </li>
          <li>
            <strong>Dados de Uso e Preferências:</strong> Figurinhas salvas como favoritas, histórico de downloads e preferências de exibição de temas.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">3. Finalidade do Tratamento dos Dados</h2>
        <p>Utilizamos os dados coletados exclusivamente para:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li>Autenticar seu acesso e garantir a segurança da sua conta;</li>
          <li>Identificar e liberar o status de assinatura <strong>Premium</strong> aos usuários pagantes;</li>
          <li>Sincronizar sua lista de figurinhas favoritas entre diferentes dispositivos;</li>
          <li>Prestar suporte ao cliente e enviar avisos essenciais sobre o serviço;</li>
          <li>Melhorar continuamente a qualidade das figurinhas e do catálogo oferecido.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">4. Compartilhamento de Informações</h2>
        <p>
          Nós <strong>não vendemos, alugamos ou comercializamos</strong> seus dados pessoais para terceiros para fins de publicidade. O compartilhamento ocorre estritamente quando necessário com os seguintes provedores de infraestrutura essencial:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li><strong>Mercado Pago:</strong> para processamento seguro de pagamentos e cobranças recorrentes;</li>
          <li><strong>Google APIs / Identity Services:</strong> para permitir login seguro e autenticação rápida;</li>
          <li><strong>Provedores de Nuvem e Hospedagem (Google Cloud / Netlify):</strong> para armazenamento e disponibilidade do banco de dados e arquivos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">5. Seus Direitos (LGPD)</h2>
        <p>
          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), você possui o direito de:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li>Confirmar a existência de tratamento de seus dados pessoais;</li>
          <li>Acessar seus dados ou solicitar a retificação de informações incompletas ou desatualizadas;</li>
          <li>Solicitar a exclusão definitiva da sua conta e de todos os dados associados a qualquer momento;</li>
          <li>Revogar consentimentos concedidos anteriormente.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">6. Exclusão de Conta e Dados</h2>
        <p>
          Caso deseje solicitar a remoção completa da sua conta e a exclusão definitiva dos seus dados de nossos servidores, basta entrar em contato com nossa equipe pelo e-mail de suporte informado abaixo. O processamento será concluído em até 5 dias úteis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">7. Contato</h2>
        <p>
          Para esclarecer dúvidas sobre esta Política de Privacidade ou exercer seus direitos de privacidade, entre em contato através do e-mail:{' '}
          <a href="mailto:suporte@stickercenter.app" className="text-[#DFB992] underline">
            suporte@stickercenter.app
          </a>.
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  useDocumentMeta('Termos de Serviço | Stories & Stickers', 'Termos e condições de uso da plataforma Stories & Stickers.');

  return (
    <LegalShell title="Termos de Serviço" lastUpdated="27 de Outubro de 2026">
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar, navegar ou utilizar o aplicativo e website <strong>Stories &amp; Stickers</strong>, você concorda expressamente em cumprir e estar vinculado aos presentes Termos de Serviço e a todas as leis e regulamentos aplicáveis. Caso discorde de qualquer parte destes termos, não utilize o serviço.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">2. Descrição do Serviço</h2>
        <p>
          O Stories &amp; Stickers é uma plataforma de catálogo e distribuição de elementos gráficos, adesivos digitais e figurinhas transparentes (PNG) destinados à personalização de mídias sociais (como Instagram Stories, WhatsApp e criação de conteúdo).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">3. Planos e Assinaturas Premium</h2>
        <p>
          O aplicativo disponibiliza figurinhas gratuitas e pacotes exclusivos para assinantes do plano <strong>Premium</strong> (mensal ou anual).
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li><strong>Renovação Automática:</strong> As assinaturas são renovadas de forma automática periodicamente (mensal ou anualmente, conforme o plano contratado), a menos que sejam canceladas antes do fim do ciclo de faturamento.</li>
          <li><strong>Cancelamento a Qualquer Momento:</strong> O usuário pode cancelar a renovação da sua assinatura a qualquer momento na aba de seu perfil ou diretamente pelo painel do Mercado Pago. O acesso Premium continuará ativo até o término do período já faturado.</li>
          <li><strong>Pagamentos:</strong> Todas as cobranças são processadas em ambiente seguro através do provedor Mercado Pago.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">4. Licença de Uso do Conteúdo</h2>
        <p>
          Ao baixar ou copiar figurinhas do Stories &amp; Stickers:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[#C8B6A6]">
          <li>É concedida a você uma licença pessoal, não exclusiva, intransferível e revogável para aplicar e exibir as figurinhas em suas postagens, fotos e criações em redes sociais;</li>
          <li><strong>É proibido:</strong> revender, sublicenciar, redistribuir em massa ou comercializar os arquivos de figurinhas como produtos digitais independentes ou integrá-los a outros bancos de figurinhas concorrentes.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">5. Cadastro e Segurança da Conta</h2>
        <p>
          Você é o único responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades que ocorram na sua conta. Caso suspeite de acesso não autorizado, notifique imediatamente a administração do aplicativo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">6. Modificações dos Termos</h2>
        <p>
          Reservamo-nos o direito de revisar ou atualizar estes Termos de Serviço a qualquer momento. Alterações substanciais serão comunicadas na própria plataforma. O uso continuado após tais alterações constituirá sua aceitação dos novos termos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#DFB992]">7. Dúvidas e Suporte</h2>
        <p>
          Para dúvidas, sugestões ou suporte referente aos Termos de Serviço, entre em contato através do e-mail:{' '}
          <a href="mailto:suporte@stickercenter.app" className="text-[#DFB992] underline">
            suporte@stickercenter.app
          </a>.
        </p>
      </section>
    </LegalShell>
  );
}
