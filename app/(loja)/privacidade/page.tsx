export const metadata = { title: 'Política de Privacidade' };
export default function Privacidade() {
  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <h1>Política de Privacidade</h1>
      <div className="notice">Texto-modelo. Peça a revisão de um advogado antes de publicar a loja.</div>
      <h2>Quais dados coletamos</h2>
      <p>Nome, CPF, telefone, e-mail e endereço de entrega, necessários para processar pagamentos e enviar seus pedidos.</p>
      <h2>Como protegemos</h2>
      <p>O CPF é armazenado criptografado. Os demais dados ficam em banco de dados com controle de acesso: cada cliente só acessa os próprios dados. Dados de cartão não passam pela nossa loja; o pagamento é feito no Mercado Pago.</p>
      <h2>Compartilhamento</h2>
      <p>Compartilhamos dados apenas com o Mercado Pago (pagamento) e com serviços de transporte (entrega).</p>
      <h2>Seus direitos</h2>
      <p>Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo Suporte.</p>
    </div>
  );
}
