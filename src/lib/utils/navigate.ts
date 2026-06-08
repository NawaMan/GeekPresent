export interface Page {
    path: string;
    title: string;
}
export interface PageNavigation {
    first: string | undefined;
    last:  string | undefined;
    prev:  string | undefined;
    next:  string | undefined;
}

export function getPageNavigation(pages: Array<Page>, currentPath: string, prefix: string = ""): PageNavigation {
    const index = pages.findIndex((page) => page.path === currentPath);
    function addPrefix(path: string | null): string | undefined { return path ? prefix + path : undefined; }

    return {
        first: addPrefix(pages[0]?.path),
        last:  addPrefix(pages[pages.length - 1]?.path),
        prev:  addPrefix(index > 0                ? pages[index - 1]?.path : null),
        next:  addPrefix(index < pages.length - 1 ? pages[index + 1]?.path : null),
    };
}
