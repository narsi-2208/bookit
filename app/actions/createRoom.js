'use server'

import { createAdminClient } from "@/config/appwrite"
import checkAuth from "./checkAuth"
import { ID } from "node-appwrite"
import { revalidatePath } from "next/cache"

async function createRoom(previousState, formData) {
    const { databases, storage } = await createAdminClient();

    try {
        const { user } = await checkAuth();

        if (!user) {
            return { error: "You must be logged in to create a room" };
        }

        //Uploading image
        let imageID

        const image = formData.get('image')

        if(image && image.size > 0 && image.name !== 'undefined' ){
            try {
                //Upload
                const response = await storage.createFile('rooms', ID.unique(), image);
                imageID = response.$id;
            } catch (error) {
                console.log('Error in uploading image', error);
                return {
                    error: 'Error in uploading image'
                }
            }
        }else {
            console.log('No image file is provided or File is invalid');
        }

        const COLLECTION_ROOMS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS;

        const newRoom = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
            COLLECTION_ROOMS,
            ID.unique(),
            {
                user_id: user.id,
                name: formData.get('name'),
                description: formData.get('description'),
                sqft: formData.get('sqft'),
                capacity: formData.get('capacity'),
                location: formData.get('location'),
                address: formData.get('address'),
                availability: formData.get('availability'),
                price_per_hour: formData.get('price_per_hour'),
                amenities: formData.get('amenities'),
                image: imageID,
            }
        );

        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error) {
        console.error(error);
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error has occurred';
        return { error: errorMessage };
    }
}

export default createRoom;
