export const docType = Object.freeze({
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    txt: "text/plain",
    mp3: "audio/mpeg",
    wma: "audio/x-ms-wma",
    ogg: "audio/ogg",
    mp4: "video/mp4"
})

export class FileWrap {

    constructor(file: File){
        this._file = file
    }

    private _file: File;

    public get file(){
        return this._file;
    }

    get name(): string {
        return this._file.name;
    }

    get extension(): string {
        return this.name.toLowerCase().split(".").pop() || "";
    }

    get size(): number {
        return this._file.size;
    }

    async wrapped(): Promise<{content: string, docType: string, encoding: string}> {
        const result =
            await new Promise<{content: string, docType: string, encoding: string}>((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    if (typeof reader.result === "string") {
                        const result = reader.result as string;
                        const dataArray = result.split(",");
                        const content = dataArray[1];
                        const dataArray2 = dataArray[0].split(":")[1].split(";");
                        const docType = dataArray2[0];
                        const encoding = dataArray2[1];
                        resolve(
                            {
                                content,
                                docType,
                                encoding
                            }
                        );
                    } else {
                        reject(new Error("Parse data URL failed"));
                    }
                };

                reader.onerror = (error) => {
                    reject(error);
                };

                reader.readAsDataURL(this.file);
            });
        return result
    }

}