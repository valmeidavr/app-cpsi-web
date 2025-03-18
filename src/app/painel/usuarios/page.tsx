import Pagination from "@/components/paginacao";
import Breadcrumb from "@/components/ui/Breadcrumb";
import UsuariosTabela from "./components/usuarios-tabela";

const Usuarios = () => {
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Gerenciar Usuários" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Gerenciar Usuários</h1>

      <UsuariosTabela />
      <section className="flex justify-center mt-4 mb-8">
        {/* <Pagination
          currentPage={1}
          totalPages={}
          destination="/painel/clientes"
        /> */}
      </section>
    </div>
  );
};

export default Usuarios;
