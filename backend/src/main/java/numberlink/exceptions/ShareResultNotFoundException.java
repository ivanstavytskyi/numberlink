package numberlink.exceptions;

import org.springframework.http.HttpStatus;

public class ShareResultNotFoundException extends ApiException {
    public ShareResultNotFoundException() {
        super(HttpStatus.NOT_FOUND, "SHARE_NOT_FOUND", "Results not found");
    }
}
