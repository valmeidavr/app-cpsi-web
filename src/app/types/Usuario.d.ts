

export type Usuario = {
    id: number,
    nome: string,
    email: string,
    grupos: {
        grupo: {
            id: number,
            nome: string
        }
    }

}