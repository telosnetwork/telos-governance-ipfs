import {APIClient, Name, Struct, TimePointSec, UInt16, UInt64} from "@greymass/eosio";

@Struct.type('document')
export class Document extends Struct {
    @Struct.field('string') title!: string
    @Struct.field('string') subtitle!: string
    @Struct.field(Name) document_name!: Name
    @Struct.field(Name) author!: Name
    @Struct.field(UInt16) sections!: UInt16
    @Struct.field(UInt16) open_proposals!: UInt16
    @Struct.field(UInt16) amendments!: UInt16
}

@Struct.type('section')
export class Section extends Struct {
    @Struct.field(Name) section_name!: Name
    @Struct.field(UInt64) section_number!: UInt64
    @Struct.field('string') content!: string
    @Struct.field(TimePointSec) last_amended!: TimePointSec
    @Struct.field(Name) amended_by!: Name
}

export async function getAmendCids(apiClient: APIClient): Promise<Set<string>> {
    const cids: Set<string> = new Set<string>()
    const docs: string[] = []
    const docsResponse =  await apiClient.v1.chain.get_table_rows({
        code: 'amend.decide',
        table: 'documents',
        type: Document,
        limit: 10000
    })

    for (const document of docsResponse.rows) {
        const sectionsResponse = await apiClient.v1.chain.get_table_rows({
            code: 'amend.decide',
            table: 'sections',
            scope: document.document_name.value,
            type: Section,
            limit: 10000,
        })

        for (const section of sectionsResponse.rows) {
            cids.add(section.content)
        }
    }

    return cids
}