///<reference path="../../typings/index.d.ts" />
import * as React from "react";

import Picture from "./Picture";
import { TitlePack } from "./Title";
import Domain from "./domain";
import { IconPack } from "./Icons";
import { TagsPack } from "./Tags";
import { Card, CardHeader, CardFooter, CardBody } from "./helpers";
import { ConfirmDelete } from "./modals";

const Article = () =>
<Card>
    <CardHeader>
       <Picture />
    </CardHeader>
    <CardBody>
        <TitlePack />
    </CardBody>
    <CardFooter>
        <Domain />
        <IconPack />
    </CardFooter>
    <CardFooter>
        <TagsPack />
    </CardFooter>
    <ConfirmDelete/>
</Card>;

export default Article ;